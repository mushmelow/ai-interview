# llm_client.py
import logging
import os

from openai import OpenAI


class LLMClient:
    """A client for interacting with a Large Language Model (LLM) API."""

    def __init__(self):
        """
        Initializes the LLMClient.

        This method retrieves the LLM API base URL and model name from environment
        variables and initializes the OpenAI client.

        Raises:
            ValueError: If the LLM_URL or LLM_MODEL environment variables are not set.
        """
        base_url = os.getenv("LLM_URL")
        api_key = os.getenv("OPENAI_API_KEY", "")
        self.model = os.getenv("LLM_MODEL")

        if not base_url or not self.model:
            raise ValueError("Missing LLM_URL or LLM_MODEL in environment variables.")

        self.client = OpenAI(base_url=base_url, api_key=api_key)

    @staticmethod
    def cv_analyzer(
        cv_content: str,
        job_description: str,
    ):
        """
        Sends a CV and job description to the LLM for structured analysis.

        Args:
            cv_content (str): The raw text extracted from the candidate's CV.
            job_description (str): The job posting or job requirements text.

        Returns:
            str: The content of the LLM's JSON response, or None if an error occurs.
        """
        base_url = os.getenv("LLM_URL")
        api_key = os.getenv("OPENAI_API_KEY", "")
        model = os.getenv("LLM_MODEL")

        if not base_url or not model:
            raise ValueError("Missing LLM_URL or LLM_MODEL in environment variables.")

        client = OpenAI(base_url=base_url, api_key=api_key)

        system_prompt = (
            "You are a CV Analysis Specialist. Your role has two equally important parts:\n"
            "\n"
            "(1) Extract factual details from the CV:\n"
            "- Only extract information that is explicitly written in the CV.\n"
            "- Do NOT guess, infer, assume, or add information that is not clearly present.\n"
            "- If the CV does not contain a field, return an empty value according to the schema.\n"
            "- For phone numbers, emails, GitHub and LinkedIn URLs: always return them exactly as written.\n"
            "\n"
            "(2) Analyze the CV against the job description:\n"
            "- You may reason about how well the candidate matches the job requirements.\n"
            "- You may summarize work experience, as long as it is strictly based on the CV.\n"
            "- For fitAnalysis, base your reasoning ONLY on facts present in the CV.\n"
            "- For fitScore (0-100), use a grounded evaluation based strictly on:\n"
            "  - required skills found in CV,\n"
            "  - relevant experience in CV,\n"
            "  - education relevance,\n"
            "  - alignment with job description responsibilities.\n"
            "\n"
            "Global Rules:\n"
            "- Never fabricate skills, experience, links, dates, or personal details.\n"
            "- Never assume experience with a technology unless the CV explicitly states it.\n"
            "- If uncertain about a detail, leave it empty instead of improvising.\n"
            "- Output must strictly respect the JSON schema. No additional text.\n"
        )

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"CV CONTENT:\n{cv_content}\n\nJOB DESCRIPTION:\n{job_description}",
                    },
                ],
                reasoning_effort="high",
                temperature=0.2,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "CVAnalysisResult",
                        "description": "Structured analysis extracted from the applicant's CV.",
                        "schema": {
                            "$schema": "https://json-schema.org/draft/2020-12/schema",
                            "title": "CVAnalysisResult",
                            "description": "Fields describing details extracted from a CV.",
                            "type": "object",
                            "properties": {
                                "candidateName": {
                                    "type": "string",
                                    "description": "Full name of the candidate as written on the CV.",
                                },
                                "contactInformation": {
                                    "type": "object",
                                    "description": "Contact details of the candidate.",
                                    "properties": {
                                        "email": {
                                            "type": "string",
                                            "description": "Email address.",
                                        },
                                        "phone": {
                                            "type": "string",
                                            "description": "Phone number.",
                                        },
                                    },
                                },
                                "technicalSkills": {
                                    "type": "array",
                                    "description": "List of technical skills detected in the candidate's CV.",
                                    "items": {"type": "string"},
                                    "uniqueItems": True,
                                },
                                "experienceSummary": {
                                    "type": "string",
                                    "description": "A concise summary of the candidate's work experience.",
                                },
                                "education": {
                                    "type": "array",
                                    "description": "List of educational qualifications.",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "degree": {"type": "string"},
                                            "institution": {"type": "string"},
                                            "year": {"type": "string"},
                                        },
                                        "required": ["degree", "institution"],
                                    },
                                },
                                "onlineProfiles": {
                                    "type": "object",
                                    "description": "Links to professional online profiles.",
                                    "properties": {
                                        "github": {
                                            "type": "string",
                                            "description": "The absolute URL to the candidate's GitHub profile for example https://github.com/Amir-Mojtahedi",
                                        },
                                        "linkedin": {
                                            "type": "string",
                                            "description": "The absolute URL to the candidate's LinkedIn profile for example https://www.linkedin.com/in/seyed-amirreza-mojtahedi-475610262/",
                                        },
                                    },
                                },
                                "fitAnalysis": {
                                    "type": "string",
                                    "description": "How well the CV matches the job description.",
                                },
                                "fitScore": {
                                    "type": "number",
                                    "description": "Numerical score representing how well the CV matches the job description.",
                                },
                            },
                            "required": [
                                "candidateName",
                                "contactInformation",
                                "technicalSkills",
                                "experienceSummary",
                                "education",
                                "onlineProfiles",
                                "fitAnalysis",
                                "fitScore",
                            ],
                        },
                    },
                },
            )

            return response.choices[0].message.content

        except Exception as e:
            logging.error(f"Error during LLM chat completion: {e}")
            return None
