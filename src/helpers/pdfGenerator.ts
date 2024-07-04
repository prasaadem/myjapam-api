import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import archiver from "archiver";
import fs from "fs";
import { Response } from "express";
import qrcode from "qrcode";

const generateQRCode = async (subscriptionId: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    qrcode.toBuffer(
      subscriptionId,
      { errorCorrectionLevel: "H" },
      (err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      }
    );
  });
};

// Function to handle the generation and streaming of PDFs into a ZIP
export const generatePDFsAndStreamZip = async (
  totalCount: number,
  progress: number,
  content: string,
  subscriptionId: string,
  entriesPerPDF: number,
  res: Response
): Promise<void> => {
  const archive = archiver("zip", { zlib: { level: 9 } });
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${content}_pdfs.zip"`
  );
  archive.pipe(res);

  let currentEntry = 0;
  let pdfIndex = 1;
  const pdfPaths: string[] = [];

  const processPDF = async () => {
    if (currentEntry >= totalCount) {
      await archive.finalize();
      // Delete all temporary PDF files
      pdfPaths.forEach((path) => fs.unlinkSync(path));
      return;
    }

    const pdfPath = `${content}_${pdfIndex}.pdf`;
    pdfPaths.push(pdfPath); // Store the path of the generated PDF
    const pdf = new PDFDocument();
    const pdfStream = fs.createWriteStream(pdfPath);
    pdf.pipe(pdfStream);

    const qrCode = await generateQRCode(subscriptionId);
    pdf.image(qrCode, 50, 50, { width: 100, height: 100 });

    for (
      let entry = currentEntry;
      entry < Math.min(totalCount, pdfIndex * entriesPerPDF);
      entry++
    ) {
      // Add a new page for every 100 entries
      if (entry % (10 * 10) === 0 && entry !== currentEntry) {
        pdf.addPage();
      }
      const row = Math.floor((entry % 100) / 10);
      const col = entry % 10;
      const x = 50 + col * 50;
      const y = 150 + row * 50;

      pdf.rect(x, y, 50, 50).stroke();
      pdf.fontSize(6);
      if (entry < progress) {
        pdf.text(content, x + 2, y + 7, {
          width: 21,
          align: "center",
        });
      }
    }

    pdf.end();

    // Ensure the file is fully written and closed before appending to the archive
    await new Promise((resolve) => pdfStream.on("finish", resolve));
    archive.append(fs.createReadStream(pdfPath), { name: pdfPath });
    currentEntry += entriesPerPDF;
    pdfIndex++;
    await processPDF(); // Process the next PDF
  };

  await processPDF(); // Start processing
};
