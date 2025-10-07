const QRCode = require('qrcode');

exports.generateQRCode = async (code) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(code, {
      errorCorrectionLevel: process.env.QR_CODE_ERROR_CORRECTION || 'M',
      type: 'image/png',
      width: parseInt(process.env.QR_CODE_SIZE) || 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

