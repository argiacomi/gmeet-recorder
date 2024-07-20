import { inflate } from 'pako';

function isGzipCompressed(data) {
  if (!data || data.length < 3) return false;
  const gzipSignature = [31, 139, 8];
  return data.slice(0, 3).every((byte, index) => byte === gzipSignature[index]);
}

function unzip(compressedData) {
  const dataArray = new Uint8Array(compressedData);
  if (isGzipCompressed(dataArray)) {
    try {
      return inflate(dataArray);
    } catch (error) {
      console.error('Decompression error:', error);
    }
  }
  return dataArray;
}

async function base64ToBlob(base64String) {
  try {
    const [metadataPart, dataPart] = base64String.split(',');
    const mimeType = metadataPart.split(':')[1].split(';')[0];
    const binaryString = atob(dataPart);
    const length = binaryString.length;
    const dataArray = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      dataArray[i] = binaryString.charCodeAt(i);
    }

    return new Blob([dataArray], { type: mimeType });
  } catch (error) {
    throw new Error('Failed to convert base64 to Blob: ' + error.message);
  }
}

export { base64ToBlob, unzip };
