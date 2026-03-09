import { PDFDocument, PDFName } from 'pdf-lib';
import { pdfjsLib } from './pdfjs';

/**
 * Detect fillable form fields in a PDF
 * @param {File} file - The PDF file to analyze
 * @returns {Promise<Object>} Form fields info
 */
export async function detectFormFields(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();
    
    const fields = form.getFields();
    
    if (fields.length === 0) {
      return {
        hasFields: false,
        fields: [],
        message: 'No fillable form fields found in this PDF'
      };
    }
    
    const fieldData = fields.map((field, index) => {
      const type = field.constructor.name;
      const name = field.getName();
      
      return {
        id: `field-${index}`,
        name,
        type,
        value: field.defaultValue || ''
      };
    });
    
    return {
      hasFields: true,
      fields: fieldData,
      message: `Found ${fieldData.length} fillable form field(s)`
    };
  } catch (err) {
    console.error('Error detecting form fields:', err);
    return {
      hasFields: false,
      fields: [],
      message: 'Unable to detect form fields',
      error: err.message
    };
  }
}

/**
 * Fill form fields in a PDF
 * @param {File} file - The PDF file
 * @param {Object} formData - Key-value pairs of field names and values
 * @returns {Promise<Uint8Array>} PDF bytes with filled form
 */
export async function fillFormFields(file, formData) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();
    
    const fields = form.getFields();
    
    for (const field of fields) {
      const fieldName = field.getName();
      if (formData[fieldName]) {
        try {
          field.setText(String(formData[fieldName]));
        } catch (err) {
          console.warn(`Could not fill field "${fieldName}":`, err);
        }
      }
    }
    
    // Flatten form (make fields non-interactive)
    form.flatten();
    
    return await pdfDoc.save();
  } catch (err) {
    console.error('Error filling form fields:', err);
    throw err;
  }
}

/**
 * Get all text/form annotations from a PDF page
 * @param {File} file - The PDF file
 * @param {number} pageNumber - Page number (0-indexed)
 * @returns {Promise<Array>} Array of annotations
 */
export async function getPageAnnotations(file, pageNumber) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfData = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdfData.getPage(pageNumber + 1);
    const annotations = await page.getAnnotations();
    
    return annotations.filter(ann => 
      ann.subtype === 'Widget' || // Form field
      ann.subtype === 'FreeText' // Text annotation
    ).map(ann => ({
      id: ann.id,
      type: ann.subtype,
      content: ann.contents || '',
      rect: ann.rect,
      fieldName: ann.fieldName
    }));
  } catch (err) {
    console.error('Error getting annotations:', err);
    return [];
  }
}

/**
 * Add a text annotation to a PDF
 * @param {File} file - The PDF file
 * @param {number} pageIndex - Page index (0-based)
 * @param {Object} annotation - Annotation data
 * @returns {Promise<Uint8Array>} PDF bytes with annotation
 */
export async function addTextAnnotation(file, pageIndex, annotation) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    if (!pages[pageIndex]) {
      throw new Error(`Page ${pageIndex + 1} not found`);
    }
    
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    
    // Position from normalized coordinates (0-1)
    const x = (annotation.x || 0) * width;
    const y = height - (annotation.y || 0) * height - 20; // Subtract text height
    
    // Add text to page
    page.drawText(annotation.text || '', {
      x,
      y,
      size: annotation.fontSize || 12,
      color: annotation.color || [0, 0, 0],
      opacity: annotation.opacity || 1,
    });
    
    return await pdfDoc.save();
  } catch (err) {
    console.error('Error adding text annotation:', err);
    throw err;
  }
}
