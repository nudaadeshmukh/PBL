package com.example.sable.blockchain;

import com.example.sable.dto.GanacheBlockDto;
import com.example.sable.dto.BlockchainVerificationDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    @GetMapping("/api/blockchain/blocks")
    public List<GanacheBlockDto> getRecentBlocks(@RequestParam(defaultValue = "20") int limit) throws Exception {
        return blockchainService.getRecentBlocks(limit);
    }

    @GetMapping("/api/blockchain/verify")
    public BlockchainVerificationDto verify(@RequestParam(defaultValue = "20") int blockLimit) throws Exception {
        return blockchainService.verifyBlockchainAndDatabase(blockLimit);
    }
}

