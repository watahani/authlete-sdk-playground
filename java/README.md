# Java Console App

## Running the Application

Execute the following command inside the Docker container:

```bash
mvn compile exec:java -Dexec.mainClass="com.authlete.sdklab.App"
```

Or build and run the JAR file:

```bash
mvn compile
mvn exec:java -Dexec.mainClass="com.authlete.sdklab.App"
```
