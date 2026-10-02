FROM node:22-alpine
RUN npm install -g @ashusevim/httpal
ENTRYPOINT ["httpal"]
CMD ["--help"]
