# Stage 1: Use the minlag image as a source for a working Mermaid CLI + Puppeteer installation
FROM minlag/mermaid-cli:11.9.1-beta.3 AS mermaid-source

# Stage 2: Main application image using Ford's Python UBI
FROM fcr.ford.com/python-coe/python-ubi:3.12-latest

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

## Set proxy environment variables
ENV HTTP_PROXY=$HTTP_PROXY \
    HTTPS_PROXY=$HTTPS_PROXY \
    NO_PROXY=$NO_PROXY \
    http_proxy=$HTTP_PROXY \
    https_proxy=$HTTPS_PROXY \
    no_proxy=$NO_PROXY

## Accept and set build arguments for JFrog
ARG JFROG_AUTH_TOKEN
ARG JFROG_AUTH_EMAIL
ENV JFROG_AUTH_TOKEN=$JFROG_AUTH_TOKEN \
    JFROG_AUTH_EMAIL=$JFROG_AUTH_EMAIL

#==============================================================================
# Install System Dependencies and Use Existing Node.js
#==============================================================================

# 1. Install the RUNTIME libraries that the pre-built Chromium needs to execute.
RUN yum update -y && \
    yum install -y \
        wget tar gzip unzip perl fontconfig which \
        alsa-lib at-spi2-atk cups-libs gtk3 libXcomposite libXdamage libXext \
        libXfixes libXrandr libXScrnSaver libXtst pango nss && \
    yum clean all

# 2. Use the existing Node.js installation (Node.js 20 is already installed in the base image)
# No need to install Node.js again

# 3. Copy Puppeteer cache from the mermaid-source image
COPY --from=mermaid-source /home/mermaidcli/.cache/puppeteer/ /root/.cache/puppeteer/

# 4. Set environment variables to control Puppeteer's behavior.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run"

# 5. Create Puppeteer config file for mermaid
RUN mkdir -p /root/.config && \
    echo '{"args":["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-first-run"]}' > /root/.config/puppeteer.json

# 6. Verify Node.js installation
RUN echo "--- Verifying existing Node.js installation ---" && \
    node --version && \
    npm --version

RUN set -ex && \
    echo "--- Installing Mermaid CLI v11.4.2 globally via npm ---" && \
    npm install -g --unsafe-perm @mermaid-js/mermaid-cli@11.4.2 && \
    \
    echo "--- Verifying tool installations ---" && \
    node --version && \
    npm --version && \
    which mmdc && \
    mmdc --version && \
    \
    echo "--- Running mmdc test to confirm it can launch the browser ---" && \
    export PATH="/usr/local/bin:$PATH" && \
    echo "graph TD; A-->B" | mmdc -i - -o /tmp/test.svg -p /root/.config/puppeteer.json && \
    echo "mmdc test successful. Output file created:" && \
    ls -l /tmp/test.svg

# #Add explicit PATH update to ensure mmdc is found
ENV PATH="/usr/local/bin:/root/.npm-global/bin:$PATH"

#==============================================================================
# Install TeX Live (LaTeX)
#==============================================================================
RUN cd /tmp && \
    wget -O install-tl-unx.tar.gz http://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz && \
    tar -xzf install-tl-unx.tar.gz && \
    INSTALL_DIR=$(find . -maxdepth 1 -type d -name "install-tl-*") && \
    cd "$INSTALL_DIR" && \
    echo "selected_scheme scheme-full" > texlive.profile && \
    echo "tlpdbopt_install_docfiles 0" >> texlive.profile && \
    echo "tlpdbopt_install_srcfiles 0" >> texlive.profile && \
    ./install-tl --profile=texlive.profile && \
    rm -rf /tmp/install-tl*

# Find and set the TeX Live PATH
RUN TEXLIVE_BIN_DIR=$(find /usr/local/texlive/*/bin -type d -name "*linux*" 2>/dev/null | head -1) && \
    echo "Found TeX Live bin directory: $TEXLIVE_BIN_DIR" && \
    echo "export PATH=\"$TEXLIVE_BIN_DIR:\$PATH\"" >> /etc/profile

# Set the TeX Live PATH environment variable
ENV PATH="/usr/local/texlive/2025/bin/x86_64-linux:$PATH"

# After the TeX Live installation, add verification
RUN echo "--- Verifying TeX Live installation ---" && \
    echo "Current PATH: $PATH" && \
    ls -la /usr/local/texlive/2025/bin/ && \
    which pdflatex && \
    pdflatex --version && \
    which xelatex && \
    xelatex --version

#==============================================================================
# Install Pandoc
#==============================================================================
RUN cd /tmp && \
    wget https://github.com/jgm/pandoc/releases/download/3.1.9/pandoc-3.1.9-linux-amd64.tar.gz && \
    tar xvzf pandoc-3.1.9-linux-amd64.tar.gz --strip-components=1 -C /usr/local && \
    rm -rf /tmp/pandoc*

#==============================================================================
# Configure Environment and Install Python Dependencies
#==============================================================================
# Add the Node binaries directory to the PATH for good measure.
ENV PATH="/usr/local/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python Dependencies
COPY app/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip -r requirements.txt --index-url https://pypi.org/simple --proxy=http://internet.ford.com:83

# Install pypandoc for Python integration
RUN pip install pypandoc --index-url https://pypi.org/simple --proxy=http://internet.ford.com:83

# Install fordllm packages from the specified registry
RUN pip install --no-cache-dir --extra-index-url https://us-central1-python.pkg.dev/ford-e1efecf6706bfdab0dda9060/fordllm/simple/ \
     fordllm-langchain \
     fordllm-sdk

#==============================================================================
# Final Application Setup
#==============================================================================
# Copy the rest of the application code
COPY app/ .

# Create app-level puppeteer config
RUN echo '{"args":["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-first-run"]}' > /app/puppeteer-config.json

# Fix permissions for entrypoint and create temp directories
RUN mkdir -p /app/temp/mermaid && \
    chmod -R 777 /app/temp && \
    # Final verification that everything is working \
    echo "=== Final verification ===" && \
    which mmdc && \
    mmdc --version && \
    echo "graph TD; A[Start]-->B[End]" | mmdc -i - -o /app/temp/mermaid/test.svg -p /app/puppeteer-config.json && \
    ls -la /app/temp/mermaid/ && \
    echo "All tools verified successfully"

# Expose Port and define the run command
EXPOSE 8040
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8040"]