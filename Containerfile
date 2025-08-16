FROM fedora:latest
RUN dnf install -y npm nodejs tsc yt-dlp
RUN groupadd veetibot && useradd -g veetibot veetibot
RUN mkdir /veetibot && chown -R veetibot:veetibot veetibot
WORKDIR veetibot
COPY src src
COPY package.json .
COPY tsconfig.json .
RUN chown -R veetibot:veetibot ./
USER veetibot
RUN npm install && npm install puppeteer && npm run build
