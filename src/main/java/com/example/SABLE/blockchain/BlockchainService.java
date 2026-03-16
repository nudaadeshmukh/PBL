package com.example.SABLE.blockchain;

import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.Transfer;
import org.web3j.utils.Convert;

import java.math.BigDecimal;

@Service
public class BlockchainService {

    private final Web3j web3j;

    public BlockchainService() {
        this.web3j = Web3j.build(new HttpService("http://127.0.0.1:7545"));
    }

    public String sendTransaction() throws Exception {

        String privateKey = "0xe0396dd66930d63f462627faa75345913890d5476f4441b2bfb639a8a838f51f";

        Credentials credentials = Credentials.create(privateKey);

        var receipt = Transfer.sendFunds(
                web3j,
                credentials,
                "0x2787179e1c6eF74ab526bB2F90A089d1d8AdDa8c",   // another Ganache account
                BigDecimal.valueOf(0.01),
                Convert.Unit.ETHER
        ).send();

        return receipt.getTransactionHash();
    }
}