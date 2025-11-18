#!/bin/bash

# Ollama Setup Script for AI Interview Platform
echo "🦙 Setting up Ollama for free AI question generation..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Installing..."
    
    # Install Ollama
    curl -fsSL https://ollama.ai/install.sh | sh
    
    echo "✅ Ollama installed successfully!"
else
    echo "✅ Ollama is already installed"
fi

# Start Ollama service
echo "🚀 Starting Ollama service..."
ollama serve &

# Wait for service to start
sleep 5

# Pull Llama 2 model (free and good for text generation)
echo "📥 Downloading Llama 2 model (this may take a few minutes)..."
ollama pull llama2

echo "✅ Ollama setup complete!"
echo ""
echo "🎯 Your AI Interview Platform now uses FREE AI!"
echo "   - No API costs"
echo "   - No quota limits"
echo "   - Runs locally on your machine"
echo ""
echo "🚀 You can now generate unlimited AI questions for free!"
echo ""
echo "📋 Available models:"
ollama list
