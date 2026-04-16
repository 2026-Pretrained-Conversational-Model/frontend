FROM nginx:alpine

# 기본 nginx 설정 제거
RUN rm /etc/nginx/conf.d/default.conf

# 커스텀 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 정적 파일
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]