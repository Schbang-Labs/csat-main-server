import pdfmake from 'pdfmake';
import robotoFonts from 'pdfmake/fonts/Roboto.js';

const PDF_TITLE = 'CSAT Cycle Summary';

let fontsConfigured = false;

const ensurePdfSetup = () => {
  if (fontsConfigured) return;
  pdfmake.addFonts(robotoFonts);
  pdfmake.setUrlAccessPolicy(() => false);
  fontsConfigured = true;
};

const toText = value => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value.trim() || '-';
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `${value}` : '-';
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.length ? value.map(item => toText(item)).join(', ') : '-';
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const toNumberText = value => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '-';
};

const splitParagraphs = text => {
  if (!text || typeof text !== 'string') return [];
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
};

const mapAttentionRow = row => [
  toText(row.brandName),
  toNumberText(row.avgCSAT),
  toNumberText(row.avgNPS),
  toText(row.totalResponses),
  toText(row.classification),
  toText(row.reason),
  toText(row.improvements),
];

const buildFallbackAttentionRows = brandAggregation => {
  if (!Array.isArray(brandAggregation)) return [];
  return brandAggregation
    .filter(item => ['average', 'critical'].includes(String(item.classification || '').toLowerCase()))
    .map(item =>
      mapAttentionRow({
        brandName: item.brandName,
        avgCSAT: item.avgSatisfaction,
        avgNPS: item.avgNPS,
        totalResponses: item.totalResponses,
        classification: item.classification,
        reason:
          'Derived from aggregated CSAT classification due to missing structured JSON table.',
        improvements: 'Review detailed client feedback and prepare cycle-specific corrective actions.',
      })
    );
};

export const getBrandsTableRows = summaryRecord => {
  const primaryRows = Array.isArray(summaryRecord?.brandsNeedingAttention)
    ? summaryRecord.brandsNeedingAttention.map(mapAttentionRow)
    : [];

  if (primaryRows.length > 0) return primaryRows;
  return buildFallbackAttentionRows(summaryRecord?.brandAggregation);
};

const buildAppendixRows = brandAggregation => {
  if (!Array.isArray(brandAggregation) || brandAggregation.length === 0) return [];

  const header = [
    'Brand',
    'Avg CSAT',
    'Avg NPS',
    'Responses',
    'POCs',
    'Classification',
  ];
  const rows = brandAggregation.map(row => [
    toText(row.brandName),
    toNumberText(row.avgSatisfaction),
    toNumberText(row.avgNPS),
    toText(row.totalResponses),
    toText(row.pocCount),
    toText(row.classification),
  ]);
  return [header, ...rows];
};

export const generateCycleSummaryPdfBuffer = async summaryRecord => {
  ensurePdfSetup();

  const tableRows = getBrandsTableRows(summaryRecord);
  const attentionBody = [
    ['Brand', 'Avg CSAT', 'Avg NPS', 'Responses', 'Classification', 'Reason', 'Improvements'],
    ...tableRows,
  ];

  const executiveSummaryParagraphs = splitParagraphs(summaryRecord?.executiveSummary);
  const recommendations =
    Array.isArray(summaryRecord?.recommendations) && summaryRecord.recommendations.length > 0
      ? summaryRecord.recommendations.map(item => toText(item))
      : ['No explicit actionable recommendations were provided.'];
  const executiveSummaryContent =
    executiveSummaryParagraphs.length > 0
      ? executiveSummaryParagraphs.map(paragraph => ({
        text: paragraph,
        style: 'bodyText',
      }))
      : [{ text: 'No executive summary available.', style: 'bodyText' }];

  const appendixRows = buildAppendixRows(summaryRecord?.brandAggregation);

  const content = [
    { text: PDF_TITLE, style: 'title' },
    {
      text: `Cycle: ${toText(summaryRecord?.cycleInfo?.name)} | Year: ${toText(summaryRecord?.cycleInfo?.year)} | Cycle Number: ${toText(summaryRecord?.cycleInfo?.cycleNumber)}`,
      style: 'meta',
    },
    {
      text: `Summary ID: ${toText(summaryRecord?._id)}`,
      style: 'metaSmall',
      margin: [0, 0, 0, 12],
    },
    { text: 'Executive Summary', style: 'sectionTitle' },
    ...executiveSummaryContent,
    { text: 'Brands Needing Attention', style: 'sectionTitle' },
    {
      table: {
        headerRows: 1,
        widths: [90, 45, 45, 55, 70, '*', '*'],
        body: attentionBody,
      },
      layout: 'lightHorizontalLines',
      margin: [0, 4, 0, 12],
    },
    { text: 'Actionable Recommendations', style: 'sectionTitle' },
    { ul: recommendations, margin: [0, 2, 0, 0] },
  ];

  if (appendixRows.length > 1) {
    content.push(
      { text: 'Brand Aggregation Appendix', style: 'sectionTitle', pageBreak: 'before' },
      {
        table: {
          headerRows: 1,
          widths: [130, 60, 60, 65, 55, 80],
          body: appendixRows,
        },
        layout: 'lightHorizontalLines',
      }
    );
  }

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [24, 24, 24, 24],
    info: {
      title: `${PDF_TITLE} - ${toText(summaryRecord?.cycleInfo?.name)}`,
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
    },
    styles: {
      title: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 8],
      },
      meta: {
        fontSize: 10,
        color: '#374151',
        margin: [0, 0, 0, 2],
      },
      metaSmall: {
        fontSize: 8,
        color: '#6b7280',
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        margin: [0, 12, 0, 8],
      },
      bodyText: {
        margin: [0, 0, 0, 6],
      },
    },
    content,
  };

  const pdf = pdfmake.createPdf(docDefinition);
  return pdf.getBuffer();
};

export default {
  generateCycleSummaryPdfBuffer,
  getBrandsTableRows,
};
