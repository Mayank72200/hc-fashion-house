# Start from your newly created, pre-built base image
FROM us-central1-docker.pkg.dev/ford-bbfd8f90a37aa7c3fcd1ded7/ford-container-images/plm-genai-mf-conversion:base-latest

# Accept and set build arguments for JFrog
ARG JFROG_AUTH_TOKEN
ARG JFROG_AUTH_EMAIL
ENV JFROG_AUTH_TOKEN=$JFROG_AUTH_TOKEN \
    JFROG_AUTH_EMAIL=$JFROG_AUTH_EMAIL

WORKDIR /app

#==============================================================================
# Install Mermaid CLI, Chrome, and Pandoc Dependencies
#==============================================================================

# Install additional system dependencies for Mermaid CLI and Chrome
RUN yum update -y --skip-broken && \
    yum install -y \
        unzip which \
        alsa-lib at-spi2-atk cups-libs gtk3 libXcomposite libXdamage libXext \
        libXfixes libXrandr libXScrnSaver libXtst pango nss && \
    yum clean all

# Install Mermaid CLI
RUN npm install -g --unsafe-perm @mermaid-js/mermaid-cli@11.4.2

# Download and setup Chrome manually, ignoring missing dependencies
RUN cd /opt && \
    wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm && \
    rpm -ivh --nodeps ./google-chrome-stable_current_x86_64.rpm && \
    rm -f google-chrome-stable_current_x86_64.rpm

# Find the actual Chrome executable and create a consistent path
RUN echo "Searching for Chrome installation..." && \
    find / -name "google-chrome*" -type f 2>/dev/null | head -10 && \
    find / -name "chrome" -type f 2>/dev/null | head -10 && \
    CHROME_PATH=$(find /opt /usr -name "google-chrome*" -type f -executable 2>/dev/null | head -1) && \
    if [ -z "$CHROME_PATH" ]; then \
        CHROME_PATH=$(find /opt /usr -name "chrome" -type f -executable 2>/dev/null | head -1); \
    fi && \
    if [ -n "$CHROME_PATH" ]; then \
        echo "Chrome found at: $CHROME_PATH" && \
        echo '#!/bin/bash' > /usr/local/bin/chrome-browser && \
        echo 'exec '"$CHROME_PATH"' --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding "$@"' >> /usr/local/bin/chrome-browser && \
        chmod +x /usr/local/bin/chrome-browser; \
    else \
        echo "Chrome not found, creating dummy executable" && \
        echo '#!/bin/bash' > /usr/local/bin/chrome-browser && \
        echo 'echo "Chrome not available"' >> /usr/local/bin/chrome-browser && \
        chmod +x /usr/local/bin/chrome-browser; \
    fi
# Configure Puppeteer to use the Chrome binary
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run" \
    PUPPETEER_EXECUTABLE_PATH="/usr/local/bin/chrome-browser"

# Create Puppeteer config files
RUN mkdir -p /root/.config /app/.config /usr/local/lib/node_modules/@mermaid-js/mermaid-cli/.config && \
    echo '{"args":["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-first-run","--disable-background-timer-throttling","--disable-backgrounding-occluded-windows","--disable-renderer-backgrounding"],"executablePath":"/usr/local/bin/chrome-browser"}' > /root/.config/puppeteer.json && \
    echo '{"args":["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-first-run","--disable-background-timer-throttling","--disable-backgrounding-occluded-windows","--disable-renderer-backgrounding"],"executablePath":"/usr/local/bin/chrome-browser"}' > /app/.config/puppeteer.json && \
    echo '{"args":["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-first-run","--disable-background-timer-throttling","--disable-backgrounding-occluded-windows","--disable-renderer-backgrounding"],"executablePath":"/usr/local/bin/chrome-browser"}' > /usr/local/lib/node_modules/@mermaid-js/mermaid-cli/.config/puppeteer.json

# Create a wrapper script for mmdc that forces the correct arguments
RUN echo '#!/bin/bash' > /usr/local/bin/mmdc-wrapper && \
    echo 'export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true' >> /usr/local/bin/mmdc-wrapper && \
    echo 'export PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run"' >> /usr/local/bin/mmdc-wrapper && \
    echo 'export PUPPETEER_EXECUTABLE_PATH="/usr/local/bin/chrome-browser"' >> /usr/local/bin/mmdc-wrapper && \
    echo '/usr/local/bin/mmdc --puppeteerConfigFile /root/.config/puppeteer.json "$@"' >> /usr/local/bin/mmdc-wrapper && \
    chmod +x /usr/local/bin/mmdc-wrapper
# Install Pandoc
RUN cd /tmp && \
    wget https://github.com/jgm/pandoc/releases/download/3.1.9/pandoc-3.1.9-linux-amd64.tar.gz && \
    tar xvzf pandoc-3.1.9-linux-amd64.tar.gz --strip-components=1 -C /usr/local && \
    rm -rf /tmp/pandoc*

# Update PATH to include all binaries
ENV PATH="/usr/local/texlive/2025/bin/x86_64-linux:/usr/local/bin:/root/.npm-global/bin:$PATH"

#==============================================================================
# Install Python Dependencies
#==============================================================================

# Install fordllm packages with access to public PyPI for dependencies
RUN pip install --no-cache-dir \
    --index-url https://pypi.org/simple \
    --extra-index-url https://us-central1-python.pkg.dev/ford-e1efecf6706bfdab0dda9060/fordllm/simple/ \
    --proxy=http://internet.ford.com:83 \
    'PyMuPDF>=1.23.0' \
    fordllm-langchain \
    fordllm-sdk

# Install Python Dependencies
COPY app/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip -r requirements.txt --index-url https://pypi.org/simple --proxy=http://internet.ford.com:83

# Install additional Python packages
RUN pip install langchain-elasticsearch av openai --index-url https://pypi.org/simple --proxy=http://internet.ford.com:83
RUN pip install pathlib json_repair tiktoken aiofiles asyncio networkx --index-url https://pypi.org/simple --proxy=http://internet.ford.com:83
RUN pip install pandas openpyxl python-multipart google-cloud-firestore google-cloud-aiplatform --index-url https://pypi.org/simple --proxy=http://internet.ford.com:83
RUN pip install markdown-to-json SpeechRecognition olefile antiword docx2txt easyocr Pillow markdownify python-pptx vertexai magika defusedxml PyMuPDF pydub pypdf --index-url https://pypi.org/simple --proxy=http://internet.ford.com:83
RUN pip install pypdf2 whisper-openai hiredis redis-py-cluster fakeredis google-cloud-run google-auth nltk --index-url https://pypi.org/simple --proxy=http://internet.ford.com:83

# Install pypandoc for Python integration
RUN pip install pypandoc --index-url https://pypi.org/simple --proxy=http://internet.ford.com:83

# Pin langchain versions required by fordllm-langchain
RUN pip install langchain-core==0.3.80 langchain==0.3.27 --index-url https://pypi.org/simple --proxy=http://internet.ford.com:83

# Install fordllm packages from the specified registry
# RUN pip install --no-cache-dir --extra-index-url https://us-central1-python.pkg.dev/ford-e1efecf6706bfdab0dda9060/fordllm/simple/ \
#     fordllm-langchain \
#     fordllm-sdk


#==============================================================================
# Final Application Setup
#==============================================================================
# Copy the rest of the application code
COPY app/ .

RUN echo '{"args":["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-first-run","--disable-background-timer-throttling","--disable-backgrounding-occluded-windows","--disable-renderer-backgrounding"]}' > /app/puppeteer-config.json && \
    ln -sf /usr/local/bin/mmdc-wrapper /usr/local/bin/mmdc-safe

# Fix permissions for entrypoint and create temp directories
RUN mkdir -p /app/temp/mermaid && \
    chmod -R 777 /app/temp && \
    # Ensure Chrome binary is executable (only if puppeteer cache exists)
    if [ -d "/root/.cache/puppeteer" ]; then \
        find /root/.cache/puppeteer -name "chrome" -type f -exec chmod +x {} \; ; \
    fi

# Set additional environment variables for runtime
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run" \
    PUPPETEER_EXECUTABLE_PATH="/usr/local/bin/chrome-browser"

# Verify installations
RUN echo "--- Verifying app dependencies ---" && \
    node --version && \
    npm --version && \
    which mmdc && \
    ls -la /usr/local/bin/chrome-browser && \
    /usr/local/bin/chrome-browser --version && \
    mmdc --version && \
    which pdflatex && \
    pdflatex --version && \
    which pandoc && \
    pandoc --version && \
    echo "--- App dependencies verified ---"

# Expose Port and define the run command
EXPOSE 8040

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8040"]

