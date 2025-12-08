"use client";
import dynamic from "next/dynamic";
import type { DocumentProps } from "react-pdf";

// Dynamically import the PDF viewer client component.
const PDFViewerClient = dynamic(() => import("./PDFViewerClient"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        fontSize: "1.2rem",
        color: "#333",
      }}
    >
      Loading PDF Viewer...
    </div>
  ),
});

type PDFViewerProps = {
  pathfile: DocumentProps["file"] | null;
};

const PDFViewer = ({ pathfile }: PDFViewerProps) => {
  if (!pathfile) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#666",
          border: "1px dashed #ccc",
          borderRadius: "8px",
        }}
      >
        Upload a resume to preview it here.
      </div>
    );
  }

  return <PDFViewerClient pathfile={pathfile} />;
};

export default PDFViewer;