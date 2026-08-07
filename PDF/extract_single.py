from pypdf import PdfReader

pdf_path = 'List of Tasks New Finals.pdf'
txt_path = 'List of Tasks New Finals.txt'
reader = PdfReader(pdf_path)
num_pages = len(reader.pages)
print(f"Reading {pdf_path}: {num_pages} pages")
text = ''
for i, page in enumerate(reader.pages):
    try:
        page_text = page.extract_text()
    except Exception as e:
        page_text = f"[Error extracting page {i+1}: {e}]"
    text += f"--- Page {i+1} ---\n{page_text}\n\n"

import sys
sys.stdout.write(f"  -> Saved to {txt_path} ({len(text)} chars)\n")