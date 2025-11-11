FROM coturn/coturn:4.7.0-r2

COPY --chmod=0755 entrypoint.sh /usr/local/bin/entrypoint.sh

ENV TURN_CONFIG_PATH=/tmp/turnserver.conf

ENTRYPOINT ["/bin/sh", "/usr/local/bin/entrypoint.sh"]
CMD ["turnserver","-c","/tmp/turnserver.conf","--log-file=stdout"]
