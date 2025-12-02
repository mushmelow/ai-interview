import logging
from typing import BinaryIO

import pdfplumber


class PDFParser:
    """A utility class for parsing text from PDF files."""

    @staticmethod
    def parse_pdf(pdf_file: BinaryIO) -> dict:
        """
        Parses a PDF file and extracts the text content.

        This method reads a PDF file page by page, extracts the text from each
        page, and concatenates it into a single string.

        Args:
            pdf_file (BinaryIO): The PDF file object to be parsed.

        Returns:
            dict: A dictionary where each key is a page number (e.g., 'page_1') and each value is the extracted text from that page. Returns an empty dictionary if an error occurs.
        """
        try:
            text = ""
            text_dict = dict()
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_dict[f"page_{page.page_number}"] = page_text
                        text += page_text + "\n"
            text_dict["full_text"] = text
            return text_dict
        except Exception as e:
            logging.error(f"Error parsing PDF file: {e}")
            return {}
