FROM nginx
RUN apt-get update; apt-get install -y nodejs npm
COPY . /app
WORKDIR /app
RUN npm i; 
COPY default.conf /etc/nginx/conf.d/default.conf
