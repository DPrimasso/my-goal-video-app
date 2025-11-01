FROM public.ecr.aws/lambda/nodejs:18

# Install dependencies for Chromium on Amazon Linux 2
RUN yum install -y \
    nss \
    freetype \
    freetype-devel \
    harfbuzz \
    ca-certificates \
    fonts-liberation \
    libappindicator \
    alsa-lib \
    atk \
    cups-libs \
    dbus-glib \
    gtk3 \
    ipa-gothic-fonts \
    libXcomposite \
    libXdamage \
    libXfixes \
    libXrandr \
    libXScrnSaver \
    libXtst \
    xorg-x11-fonts-100dpi \
    xorg-x11-fonts-75dpi \
    xorg-x11-fonts-Type1 \
    xorg-x11-fonts-misc \
    && yum clean all

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy function code
COPY index.js ./

# Set the CMD to your handler
CMD [ "index.handler" ]
