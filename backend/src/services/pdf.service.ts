import PDFDocument from 'pdfkit';

export interface LearningReportPayload {
  displayName: string;
  username: string;
  audience: string;
  cefr: string;
  level: number;
  xp: number;
  streak: number;
  completedLessons: string[];
  skills: { skill: string; accuracy: number; attempts: number }[];
  assessments: { title: string; percent: number; passed: boolean; cefr: string | null; date: string }[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  careerField?: string | null;
}

export interface CertificatePayload {
  code: string;
  displayName: string;
  title: string;
  level: string;
  issuedAt: string;
}

function bufferFromDoc(build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    build(doc);
    doc.end();
  });
}

export function buildLearningReportPdf(data: LearningReportPayload): Promise<Buffer> {
  return bufferFromDoc((doc) => {
    // Header banner
    doc.rect(0, 0, doc.page.width, 110).fill('#0A1030');
    doc.fillColor('#00D1FF').fontSize(11).text('FUTURE ENGLISH CENTER', 48, 28, { characterSpacing: 2 });
    doc.fillColor('#FFFFFF').fontSize(22).text('Official English Learning Report', 48, 48);
    doc.fillColor('#94A3D2').fontSize(10).text(`Master English. Unlock Your Future.  •  Generated ${new Date().toLocaleDateString('en-US')}`, 48, 80);

    doc.moveDown(3);
    doc.fillColor('#0A1030').fontSize(14).text('Learner Summary', 48, 130);
    doc.moveTo(48, 148).lineTo(547, 148).strokeColor('#D6DEF0').stroke();

    doc.fontSize(10.5).fillColor('#1E293B');
    doc.text(`Name: ${data.displayName} (@${data.username})`, 48, 160);
    doc.text(`Learning Track: ${data.audience}`, 320, 160);
    doc.text(`Estimated CEFR Level: ${data.cefr}`, 48, 178);
    doc.text(`Platform Level & XP: Level ${data.level} (${data.xp.toLocaleString()} XP)`, 320, 178);
    doc.text(`Best Streak: ${data.streak} day(s)`, 48, 196);
    if (data.careerField) doc.text(`Career Focus: ${data.careerField}`, 320, 196);

    // Skill development
    let y = 232;
    doc.fillColor('#0A1030').fontSize(14).text('Skill Development', 48, y);
    y += 18;
    doc.moveTo(48, y).lineTo(547, y).stroke();
    y += 12;

    for (const s of data.skills) {
      doc.fillColor('#1E293B').fontSize(10).text(s.skill, 48, y);
      doc.rect(180, y + 3, 240, 8).fill('#E2E8F0');
      doc.rect(180, y + 3, Math.round(2.4 * s.accuracy), 8).fill(s.accuracy >= 75 ? '#22C55E' : s.accuracy >= 50 ? '#00A8CC' : '#F59E0B');
      doc.fillColor('#334155').text(`${s.accuracy}% (${s.attempts} items)`, 435, y);
      y += 22;
    }

    // Assessments
    y += 10;
    doc.fillColor('#0A1030').fontSize(14).text('Assessment Results', 48, y);
    y += 18;
    doc.moveTo(48, y).lineTo(547, y).stroke();
    y += 10;
    if (data.assessments.length === 0) {
      doc.fillColor('#64748B').fontSize(10).text('No assessments completed yet.', 48, y);
      y += 20;
    } else {
      for (const a of data.assessments.slice(0, 6)) {
        doc.fillColor('#1E293B').fontSize(10).text(`• ${a.title} — ${a.percent}% (${a.passed ? 'Passed' : 'Needs Review'}${a.cefr ? `, CEFR ${a.cefr}` : ''}) [${a.date}]`, 48, y);
        y += 18;
      }
    }

    // Strengths & Recommendations
    y += 10;
    doc.fillColor('#0A1030').fontSize(14).text('Strengths, Areas to Improve & Recommendations', 48, y);
    y += 18;
    doc.moveTo(48, y).lineTo(547, y).stroke();
    y += 10;
    doc.fillColor('#15803D').fontSize(10.5).text(`Strengths: ${data.strengths.join(', ') || 'Building foundation'}`, 48, y, { width: 495 });
    y = doc.y + 8;
    doc.fillColor('#B45309').text(`Focus Areas: ${data.improvements.join(', ') || 'Keep practicing balanced skills'}`, 48, y, { width: 495 });
    y = doc.y + 10;
    doc.fillColor('#1E293B').text('Recommended Next Steps:', 48, y);
    y += 16;
    for (const r of data.recommendations.slice(0, 5)) {
      doc.text(`• ${r}`, 56, y, { width: 485 });
      y = doc.y + 4;
    }

    // Completed Topics
    y += 8;
    doc.fillColor('#0A1030').fontSize(12).text(`Completed Lessons (${data.completedLessons.length})`, 48, y);
    y += 16;
    doc.fillColor('#475569').fontSize(9.5).text(data.completedLessons.slice(0, 18).join('  •  ') || 'No completed lessons yet.', 48, y, { width: 495 });
  });
}

export function buildCertificatePdf(data: CertificatePayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const w = doc.page.width;
    const h = doc.page.height;

    doc.rect(0, 0, w, h).fill('#050816');
    doc.rect(24, 24, w - 48, h - 48).lineWidth(3).strokeColor('#00D1FF').stroke();
    doc.rect(34, 34, w - 68, h - 68).lineWidth(1).strokeColor('#A855F7').stroke();

    doc.fillColor('#00D1FF').fontSize(13).text('FUTURE ENGLISH CENTER', 0, 82, { align: 'center', characterSpacing: 4 });
    doc.fillColor('#FFFFFF').fontSize(34).text('CERTIFICATE OF ACHIEVEMENT', 0, 114, { align: 'center' });
    doc.fillColor('#94A3D2').fontSize(13).text('THIS PROUDLY CERTIFIES THAT', 0, 182, { align: 'center', characterSpacing: 2 });

    doc.fillColor('#00D1FF').fontSize(32).text(data.displayName, 0, 218, { align: 'center' });
    doc.moveTo(w * 0.25, 266).lineTo(w * 0.75, 266).lineWidth(1).strokeColor('#253269').stroke();

    doc.fillColor('#E2E8F0').fontSize(15).text(`has successfully fulfilled the curriculum and assessment requirements for`, 0, 290, { align: 'center' });
    doc.fillColor('#FFFFFF').fontSize(22).text(data.title, 0, 322, { align: 'center' });
    doc.fillColor('#A855F7').fontSize(14).text(`Proficiency Level: ${data.level}`, 0, 360, { align: 'center' });

    doc.fillColor('#94A3D2').fontSize(11).text(`Issued on ${data.issuedAt}`, 90, 465);
    doc.text(`Verification Code: ${data.code}`, w - 310, 465, { width: 220, align: 'right' });
    doc.fillColor('#00D1FF').fontSize(11).text('Master English. Unlock Your Future.', 0, 505, { align: 'center' });

    doc.end();
  });
}
