#!/bin/bash

# Script deploys the quadlet files to the user specific directories and lets systemd build the service files.
# Finally, it copies the generated service file into a static location and enables it.

set -euxo pipefail

export XDG_RUNTIME_DIR="/run/user/$(id -u)"
cp veetibot.build /home/slack-veetibot/.config/containers/systemd/
cp veetibot.container /home/slack-veetibot/.config/containers/systemd/
systemctl --user daemon-reload
cp /run/user/1005/systemd/generator/veetibot.service /home/slack-veetibot/.config/systemd/user
systemctl --user enable veetibot
