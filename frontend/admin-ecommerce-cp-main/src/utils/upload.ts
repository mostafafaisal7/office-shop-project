export async function uploadProductMedia(file: File, productId: number, token: string) {
  const formData = new FormData();
  formData.append("file", file); // Make sure 'file' matches backend

  const response = await fetch(`http://127.0.0.1:8000/products/${productId}/upload-image`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = "Failed to upload file";
    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  return await response.json();
}


