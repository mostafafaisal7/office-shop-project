export async function uploadProductMedia(file: File, productId: number, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`http://127.0.0.1:8000/products/${productId}/upload-image`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`, // Include user token if needed
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to upload file");
  }

  return await response.json(); // Returns the DB record created by FastAPI
}
