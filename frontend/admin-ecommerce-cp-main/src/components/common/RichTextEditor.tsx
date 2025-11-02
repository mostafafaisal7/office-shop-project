import { Editor } from '@tinymce/tinymce-react';
import React, { useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<any>(null);

  return (
    <Editor
        apiKey="v9cb63imehkaq110qf73liod0jor3ipzxifs6qxkowwa5kx4"
        tinymceScriptSrc="https://cdn.tiny.cloud/1/v9cb63imehkaq110qf73liod0jor3ipzxifs6qxkowwa5kx4/tinymce/7/tinymce.min.js"
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value}
        init={{
          height: 400,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
            'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar:
            'undo redo | formatselect | bold italic backcolor | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | removeformat | image media | help',

          /* Enable local image upload */
          images_upload_url: '/api/upload-image', // You'll create this
          automatic_uploads: true,
          images_upload_handler: async (blobInfo) => {
  const formData = new FormData();
  formData.append('files', blobInfo.blob(), blobInfo.filename());

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (result.success && result.files?.length > 0) {
    const filePath = result.files[0].file_path;

    if (!filePath) {
      throw new Error("Uploaded file is missing 'file_path'.");
    }

    // Construct full URL (assuming your app serves from the same domain)
    const uploadedUrl = `${window.location.origin}${filePath}`;

    return uploadedUrl;
  } else {
    throw new Error('Image upload failed: No files returned');
  }
}

        }}
        onEditorChange={(newValue) => onChange(newValue)}
      />

  );
};

export default RichTextEditor;
