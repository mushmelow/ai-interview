# llm_client.py
import os
import logging
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

    def chat(self, user_message: str, system_prompt: str = "You are a helpful assistant."):
        """
        Sends a message to the LLM and returns the response.

        Args:
            user_message (str): The message from the user.
            system_prompt (str, optional): The system prompt to use. 
                Defaults to "You are a helpful assistant.".

        Returns:
            str: The content of the LLM's response, or None if an error occurs.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            logging.error(f"Error during LLM chat completion: {e}")
            return None
