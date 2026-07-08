FROM quay.io/fedora/fedora:latest
RUN dnf install -y npm nodejs tsc unzip wget

RUN groupadd veetibot && useradd -g veetibot veetibot

RUN mkdir /veetibot && chown -R veetibot:veetibot veetibot

WORKDIR veetibot

#Manual yt-dlp download
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

COPY src src
COPY package.json .
COPY tsconfig.json .

RUN chown -R veetibot:veetibot ./
USER veetibot
RUN npm install && npm install puppeteer && npm run build
