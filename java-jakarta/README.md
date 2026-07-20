# Java Console App (Jakarta EE)

This module uses the Jakarta-based Authlete libraries
(`authlete-java-jakarta` + `jakarta.servlet-api`) and mirrors the dependency
stack of the Authlete [java-oauth-server](https://github.com/authlete/java-oauth-server)
reference server. The Authlete-related versions are kept in sync with that
server by the `Sync java-jakarta Authlete versions` GitHub Actions workflow.

**This is the recommended module for new work.** The sibling [`java-jaxrs`](../java-jaxrs)
module targets the legacy `javax.*` (Java EE / JAX-RS) stack and is kept only
for backwards-compatibility examples.

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
