<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

// Quick sanity output
fwrite(STDOUT, "Authlete SDK Playground (PHP)\n");

// Show the installed SDK version if available
if (class_exists(\Composer\InstalledVersions::class)) {
    $pkg = 'authlete/authlete';
    if (\Composer\InstalledVersions::isInstalled($pkg)) {
        $ver = \Composer\InstalledVersions::getPrettyVersion($pkg);
        fwrite(STDOUT, "$pkg: {$ver}\n");
    }
}

try {
    if (
        class_exists('Authlete\\Conf\\AuthleteEnvConfiguration') &&
        class_exists('Authlete\\Api\\AuthleteApiImpl')
    ) {
        $conf = new \Authlete\Conf\AuthleteEnvConfiguration();
        $api  = new \Authlete\Api\AuthleteApiImpl($conf);

        // Note: Authlete PHP SDK does not support grant_type "TOKEN_EXCHANGE", "JWT_BEARER"
        // if the client support those grant types, the exception will be thrown when calling
        // the API.
        $clients = $api->getClientList();
        foreach ($clients->getClients() as $c) {
            fwrite(STDOUT, ($c->getClientName() ?? '(no name)') . "\n");
        }
    } else {
        fwrite(STDOUT, "Authlete SDK classes not found.\n");
    }
} catch (\Throwable $e) {
    fwrite(STDERR, "Authlete SDK call failed: {$e->getMessage()}\n");
}
