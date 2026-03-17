package com.example.sable.blockchain;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BlockchainController {

    private final BlockchainService blockchainService;

    public BlockchainController(BlockchainService blockchainService) {
        this.blockchainService = blockchainService;
    }

    @GetMapping("/blockchain/send/{transactionId}")
    public String sendTx(@PathVariable String transactionId) throws Exception {
        return blockchainService.sendTransaction(transactionId);
    }

    @GetMapping("/blockchain/sync")
    public String syncAll() throws Exception {
        blockchainService.syncAllTransactionsToBlockchain();
        return "Synced all DB transactions to Ganache";
    }
}

