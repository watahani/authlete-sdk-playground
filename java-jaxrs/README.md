# Java Console App (JAX-RS / javax)

> **⚠️ Legacy module — `java-jakarta` is recommended.**
>
> This module targets the legacy `javax.*` (Java EE / JAX-RS) stack via
> `authlete-java-jaxrs`. The Authlete [java-oauth-server](https://github.com/authlete/java-oauth-server)
> reference server has migrated to the Jakarta namespace, so this module can no
> longer be kept in sync with it automatically. For new work, use the
> [`java-jakarta`](../java-jakarta) module instead. This module is kept for
> backwards-compatibility examples and is updated independently from Maven
> Central by the `Update Java authlete-java-jaxrs` workflow.

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
