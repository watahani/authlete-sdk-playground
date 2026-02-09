package com.authlete.sdklab;

import com.authlete.common.api.AuthleteApi;
import com.authlete.common.api.AuthleteApiFactory;
import com.authlete.common.conf.AuthleteConfiguration;
import com.authlete.common.conf.AuthleteEnvConfiguration;
import com.authlete.common.dto.Client;
import com.authlete.common.dto.ClientListResponse;

/**
 * Hello world!
 */
public class App {
    public static void main(String[] args) {
        //set environment variable

        AuthleteConfiguration conf = new AuthleteEnvConfiguration();

        AuthleteApi api = AuthleteApiFactory.create(conf);

        ClientListResponse clients = api.getClientList();
        
        for (Client c : clients.getClients()) {
            System.out.println(c.getClientName());
        }
    }
}
