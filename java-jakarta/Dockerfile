FROM maven:3.9.9-eclipse-temurin-21

USER 1000
ENV USER_HOME_DIR="/home/ubuntu/"
ENV MAVEN_CONFIG="$USER_HOME_DIR/.m2"

WORKDIR /tmp
# Install dependencies
COPY pom.xml .
RUN mvn -Dmaven.test.skip=true -Dmaven.javadoc.skip=true dependency:go-offline
