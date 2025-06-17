import sys
from docx import Document

def merge_docx(files, output_path):
    merged_document = Document()
    for i, file in enumerate(files):
        doc = Document(file)
        if i > 0:
            merged_document.add_page_break()
        for element in doc.element.body:
            merged_document.element.body.append(element)
    merged_document.save(output_path)

if __name__ == '__main__':
    merge_docx(sys.argv[1:-1], sys.argv[-1])
