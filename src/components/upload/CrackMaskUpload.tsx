import React, { useState } from 'react';

function CrackMaskUpload() {
  const [image, setImage] = useState<File | null>(null);
  const [maskUrl, setMaskUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] || null);
    setMaskUrl(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', image);
    try {
      const res = await fetch('http://localhost:8000/api/crack-mask', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to process image');
      const data = await res.json();
      setMaskUrl(data.mask_url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Crack Mask Detection</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        disabled={!image || loading}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Process Image'}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {maskUrl && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Detected Mask:</h3>
          <img src={maskUrl} alt="Crack Mask" className="border rounded" />
        </div>
      )}
    </div>
  );
}

export default CrackMaskUpload;
