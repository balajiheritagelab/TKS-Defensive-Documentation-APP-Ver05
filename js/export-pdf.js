function exportPDF(record) {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("TKS Defensive Documentation Report", 10, 10);
  doc.text(`Craft: ${record.craft.name}`, 10, 20);

  let y = 30;

  record.process_steps.forEach(step => {
    doc.text(`Step ${step.step_no}: ${step.description}`, 10, y);
    y += 8;

    if (step.image) {
      doc.addImage(step.image, 'JPEG', 10, y, 50, 30);
      y += 40;
    }
  });

  doc.text(`Hash: ${record.record_hash}`, 10, y + 10);

  doc.save(`TKS_${record.uuid}.pdf`);
}
