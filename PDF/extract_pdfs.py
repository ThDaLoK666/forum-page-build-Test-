import os
import sys
from pathlib import Path
from pypdf import PdfReader

def extract_text_from_pdf(pdf_path, txt_path, max_pages=None):
    reader = PdfReader(str(pdf_path))
    num_pages = len(reader.pages)
    print(f"Reading {pdf_path.name}: {num_pages} pages")
    texts = []
    for i, page in enumerate(reader.pages):
        if max_pages and i >= max_pages:
            texts.append(f"\n[... truncated after {max_pages} pages ...]\n")
            break
        try:
            text = page.extract_text()
        except Exception as e:
            text = f"[Error extracting page {i+1}: {e}]"
        texts.append(f"--- Page {i+1} ---\n{text}\n")
    full_text = "\n".join(texts)
    with open(txt_path, "w", encoding="utf-8", errors="replace") as f:
        f.write(full_text)
    print(f"  -> Saved to {txt_path} ({len(full_text)} chars)")

if __name__ == "__main__":
    pdf_dir = Path(".")
    pdf_files = sorted(pdf_dir.glob("*.pdf"))
    for pdf in pdf_files:
        if "List of Tasks" in pdf.name:
            txt = pdf.with_suffix(".txt")
            extract_text_from_pdf(pdf, txt)
            break
