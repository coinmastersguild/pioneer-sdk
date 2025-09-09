/*
    PDF Report Generator for Pioneer SDK Integration Testing
    
    This module extracts the PDF generation logic from the KeepKey Vault ReportDialog component
    and adapts it for e2e testing across all supported chains.
*/

import * as fs from 'fs-extra';
import * as path from 'path';
const PDFDocument = require('pdfkit');

// Define types
interface AssetData {
  symbol: string;
  networkId: string;
  balance: string;
  valueUsd?: number;
  address?: string;
  pubkey?: string;
  timestamp: string;
}

interface BitcoinAccountData {
  account: number;
  type: string;
  bip: string;
  path: string;
  xpub: string;
  receiveIndex: number;
  changeIndex: number;
  balance: string;
  totalReceived: string;
  totalSent: string;
  txCount: number;
  addressCount: number;
  explorerUrl: string;
  timestamp: string;
}

interface ReportData {
  symbol: string;
  networkId: string;
  chainType: 'bitcoin' | 'ethereum' | 'cosmos' | 'utxo' | 'other';
  accountData: BitcoinAccountData[] | AssetData[];
  summary: {
    totalAccounts: number;
    totalBalance: string;
    totalValueUsd?: number;
    totalTransactions?: number;
    totalAddresses?: number;
  };
  timestamp: string;
}

export class PDFReportGenerator {
  private outputDir: string;

  constructor(outputDir: string = './reports') {
    this.outputDir = outputDir;
  }

  async ensureOutputDir(): Promise<void> {
    await fs.ensureDir(this.outputDir);
  }

  private getChainType(symbol: string): 'bitcoin' | 'ethereum' | 'cosmos' | 'utxo' | 'other' {
    const utxoChains = ['BTC', 'LTC', 'DOGE', 'BCH', 'DASH', 'DGB'];
    const cosmosChains = ['ATOM', 'OSMO', 'RUNE', 'MAYA', 'GAIA'];
    const evmChains = ['ETH', 'AVAX', 'BNB', 'MATIC', 'OP'];
    
    if (symbol === 'BTC') return 'bitcoin';
    if (utxoChains.includes(symbol)) return 'utxo';
    if (cosmosChains.includes(symbol)) return 'cosmos';
    if (evmChains.includes(symbol)) return 'ethereum';
    return 'other';
  }

  async generateBitcoinAccountData(
    app: any,
    assetContext: any,
    accountCount: number = 3
  ): Promise<BitcoinAccountData[]> {
    const accounts: BitcoinAccountData[] = [];
    const symbol = assetContext.symbol || 'BTC';
    
    // Get XPUBs for multiple account types
    const accountTypes = [
      { type: 'Legacy', bip: 'BIP44', scriptType: 'p2pkh', pathPrefix: "m/44'/0'" },
      { type: 'SegWit', bip: 'BIP49', scriptType: 'p2sh-p2wpkh', pathPrefix: "m/49'/0'" },
      { type: 'Native SegWit', bip: 'BIP84', scriptType: 'p2wpkh', pathPrefix: "m/84'/0'" }
    ];
    
    for (let i = 0; i < accountCount; i++) {
      for (const accType of accountTypes) {
        try {
          const xpub = await app.getXpub(`${accType.pathPrefix}/${i}'`);
          
          // Get balance info from Pioneer
          const balanceData = await app.pioneer.GetXpubBalance({ xpub });
          
          accounts.push({
            account: i,
            type: accType.type,
            bip: accType.bip,
            path: `${accType.pathPrefix}/${i}'`,
            xpub: xpub,
            receiveIndex: balanceData?.receiveIndex || 0,
            changeIndex: balanceData?.changeIndex || 0,
            balance: balanceData?.balance || '0',
            totalReceived: balanceData?.totalReceived || '0',
            totalSent: balanceData?.totalSent || '0',
            txCount: balanceData?.txCount || 0,
            addressCount: balanceData?.addressCount || 0,
            explorerUrl: `https://btc1.trezor.io/xpub/${xpub}`,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.warn(`⚠️ Failed to get data for ${accType.type} account ${i}:`, error);
        }
      }
    }
    
    return accounts;
  }

  async generateReportData(app: any, assetContext: any, accountCount: number = 3): Promise<ReportData> {
    await this.ensureOutputDir();
    
    const chainType = this.getChainType(assetContext.symbol);
    let accountData: BitcoinAccountData[] | AssetData[] = [];
    
    if (chainType === 'bitcoin' || chainType === 'utxo') {
      // Generate Bitcoin-style account data with XPUBs
      accountData = await this.generateBitcoinAccountData(app, assetContext, accountCount);
    } else {
      // For other chains, generate basic asset data
      accountData = [{
        symbol: assetContext.symbol,
        networkId: assetContext.networkId,
        balance: assetContext.balance || '0',
        valueUsd: assetContext.valueUsd || 0,
        address: assetContext.address || '',
        pubkey: assetContext.pubkey || '',
        timestamp: new Date().toISOString()
      }];
    }
    
    // Calculate summary
    const totalAccounts = accountData.length;
    let totalBalance = '0';
    let totalValueUsd = 0;
    let totalTransactions = 0;
    let totalAddresses = 0;
    
    if (chainType === 'bitcoin' || chainType === 'utxo') {
      const btcData = accountData as BitcoinAccountData[];
      totalBalance = btcData.reduce((sum, acc) => {
        return (parseFloat(sum) + parseFloat(acc.balance)).toString();
      }, '0');
      totalTransactions = btcData.reduce((sum, acc) => sum + acc.txCount, 0);
      totalAddresses = btcData.reduce((sum, acc) => sum + acc.addressCount, 0);
    } else {
      const assetData = accountData as AssetData[];
      totalBalance = assetData[0]?.balance || '0';
      totalValueUsd = assetData[0]?.valueUsd || 0;
    }
    
    return {
      symbol: assetContext.symbol,
      networkId: assetContext.networkId,
      chainType,
      accountData,
      summary: {
        totalAccounts,
        totalBalance,
        totalValueUsd,
        totalTransactions,
        totalAddresses
      },
      timestamp: new Date().toISOString()
    };
  }

  async saveReportDataAsJSON(reportData: ReportData, filename: string): Promise<string> {
    const jsonPath = path.join(this.outputDir, `${filename}.json`);
    await fs.writeJSON(jsonPath, reportData, { spaces: 2 });
    console.log(`💾 Saved JSON report: ${jsonPath}`);
    return jsonPath;
  }

  async generateTextReport(reportData: ReportData, filename: string): Promise<string> {
    const textPath = path.join(this.outputDir, `${filename}.txt`);
    
    let content = `${reportData.symbol} Account Report\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Network: ${reportData.networkId}\n`;
    content += `Chain Type: ${reportData.chainType}\n`;
    content += '='.repeat(50) + '\n\n';
    
    content += 'SUMMARY STATISTICS\n';
    content += '-'.repeat(20) + '\n';
    content += `Total Accounts: ${reportData.summary.totalAccounts}\n`;
    content += `Total Balance: ${reportData.summary.totalBalance} ${reportData.symbol}\n`;
    
    if (reportData.summary.totalValueUsd) {
      content += `Total Value (USD): $${reportData.summary.totalValueUsd.toFixed(2)}\n`;
    }
    if (reportData.summary.totalTransactions !== undefined) {
      content += `Total Transactions: ${reportData.summary.totalTransactions}\n`;
    }
    if (reportData.summary.totalAddresses !== undefined) {
      content += `Total Addresses: ${reportData.summary.totalAddresses}\n`;
    }
    
    content += '\nACCOUNT DETAILS\n';
    content += '-'.repeat(20) + '\n\n';
    
    if (reportData.chainType === 'bitcoin' || reportData.chainType === 'utxo') {
      const bitcoinData = reportData.accountData as BitcoinAccountData[];
      
      for (const account of bitcoinData) {
        content += `${account.type} Account ${account.account} (${account.bip})\n`;
        content += `Path: ${account.path}\n`;
        content += `XPUB: ${account.xpub.substring(0, 50)}...\n`;
        content += `Balance: ${account.balance} ${reportData.symbol}\n`;
        content += `Receive Index: ${account.receiveIndex}\n`;
        content += `Change Index: ${account.changeIndex}\n`;
        content += `Total Received: ${account.totalReceived} ${reportData.symbol}\n`;
        content += `Total Sent: ${account.totalSent} ${reportData.symbol}\n`;
        content += `Transactions: ${account.txCount}\n`;
        content += `Used Addresses: ${account.addressCount}\n`;
        content += `Explorer: ${account.explorerUrl}\n`;
        content += `Generated: ${account.timestamp}\n\n\n`;
      }
    } else {
      const assetData = reportData.accountData as AssetData[];
      
      for (const account of assetData) {
        content += `Symbol: ${account.symbol}\n`;
        content += `Network: ${account.networkId}\n`;
        content += `Balance: ${account.balance}\n`;
        if (account.valueUsd) {
          content += `Value (USD): $${account.valueUsd.toFixed(2)}\n`;
        }
        if (account.address) {
          content += `Address: ${account.address}\n`;
        }
        content += `Timestamp: ${account.timestamp}\n\n`;
      }
    }
    
    await fs.writeFile(textPath, content, 'utf8');
    console.log(`📄 Saved text report: ${textPath}`);
    return textPath;
  }

  // Generate a PDF report for a single chain
  async generatePDFReport(reportData: ReportData, filename: string): Promise<string> {
    const pdfPath = path.join(this.outputDir, `${filename}.pdf`);
    
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      // Stream to file
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);
      
      // Add header
      doc.fontSize(22).font('Helvetica-Bold')
         .text(`${reportData.symbol} Account Report`, { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(12).font('Helvetica')
         .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(11).font('Helvetica')
         .text(`Network: ${reportData.networkId}`)
         .text(`Chain Type: ${reportData.chainType}`);
      
      doc.moveDown(2);
      
      // Summary Statistics
      doc.fontSize(16).font('Helvetica-Bold')
         .text('SUMMARY STATISTICS');
      doc.moveDown();
      
      doc.fontSize(11).font('Helvetica')
         .text(`Total Accounts: ${reportData.summary.totalAccounts}`)
         .text(`Total Balance: ${reportData.summary.totalBalance} ${reportData.symbol}`)
         .text(`Total Value (USD): $${(reportData.summary.totalValueUsd || 0).toFixed(2)}`)
         .text(`Total Transactions: ${reportData.summary.totalTransactions || 0}`)
         .text(`Total Addresses: ${reportData.summary.totalAddresses || 0}`);
      
      doc.moveDown(2);
      
      // Account details for Bitcoin-type chains
      if (reportData.chainType === 'bitcoin' || reportData.chainType === 'utxo') {
        const bitcoinData = reportData.accountData as BitcoinAccountData[];
        
        doc.fontSize(16).font('Helvetica-Bold')
           .text('ACCOUNT DETAILS');
        doc.moveDown();
        
        for (const account of bitcoinData) {
          doc.fontSize(12).font('Helvetica-Bold')
             .text(`${account.type} Account ${account.account} (${account.bip})`);
          doc.moveDown(0.5);
          
          doc.fontSize(10).font('Helvetica')
             .text(`Path: ${account.path}`)
             .text(`XPUB: ${account.xpub.substring(0, 50)}...`)
             .text(`Balance: ${account.balance} ${reportData.symbol}`)
             .text(`Transactions: ${account.txCount}`)
             .text(`Explorer: ${account.explorerUrl}`, { 
               link: account.explorerUrl,
               underline: true,
               color: 'blue'
             });
          
          doc.moveDown();
        }
      } else {
        // For other chains, show basic account data
        const assetData = reportData.accountData as AssetData[];
        
        doc.fontSize(16).font('Helvetica-Bold')
           .text('ACCOUNT DETAILS');
        doc.moveDown();
        
        for (const account of assetData) {
          doc.fontSize(10).font('Helvetica')
             .text(`Symbol: ${account.symbol}`)
             .text(`Network: ${account.networkId}`)
             .text(`Balance: ${account.balance}`)
             .text(`Value (USD): $${(account.valueUsd || 0).toFixed(2)}`)
             .text(`Address: ${account.address || 'N/A'}`);
          
          doc.moveDown();
        }
      }
      
      // Finalize the PDF
      doc.end();
      
      // Wait for the stream to finish
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });
      
      console.log(`📑 Saved PDF report: ${pdfPath}`);
      return pdfPath;
    } catch (error: any) {
      console.warn(`⚠️ PDF generation failed (${error.message}), saving as text instead`);
      // Fallback to text if PDF fails
      return await this.generateTextReport(reportData, filename);
    }
  }

  // Generate a combined PDF report for multiple chains
  async generateCombinedPDFReport(allReports: ReportData[], filename: string): Promise<string> {
    const pdfPath = path.join(this.outputDir, `${filename}.pdf`);
    
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      // Stream to file
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);
      
      // Add header
      doc.fontSize(24).font('Helvetica-Bold')
         .text('Multi-Chain Portfolio Report', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(12).font('Helvetica')
         .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
         .text(`Total Chains: ${allReports.length}`, { align: 'center' });
      
      doc.moveDown(2);
      
      // Portfolio Summary
      doc.fontSize(18).font('Helvetica-Bold')
         .text('PORTFOLIO SUMMARY');
      doc.moveDown();
      
      // Calculate totals
      let totalAccounts = 0;
      let totalValueUsd = 0;
      let totalTransactions = 0;
      let totalAddresses = 0;
      
      for (const report of allReports) {
        totalAccounts += report.summary.totalAccounts;
        totalValueUsd += report.summary.totalValueUsd || 0;
        totalTransactions += report.summary.totalTransactions || 0;
        totalAddresses += report.summary.totalAddresses || 0;
      }
      
      doc.fontSize(11).font('Helvetica')
         .text(`Total Chains: ${allReports.length}`)
         .text(`Total Accounts: ${totalAccounts}`)
         .text(`Total Portfolio Value: $${totalValueUsd.toFixed(2)} USD`)
         .text(`Total Transactions: ${totalTransactions}`)
         .text(`Total Addresses: ${totalAddresses}`);
      
      doc.moveDown(2);
      
      // Chain Breakdown
      doc.fontSize(16).font('Helvetica-Bold')
         .text('CHAIN BREAKDOWN');
      doc.moveDown();
      
      for (const [index, report] of allReports.entries()) {
        doc.fontSize(11).font('Helvetica')
           .text(`${index + 1}. ${report.symbol}`)
           .text(`   Network: ${report.networkId.substring(0, 40)}...`)
           .text(`   Accounts: ${report.summary.totalAccounts}`)
           .text(`   Balance: ${report.summary.totalBalance} ${report.symbol}`);
        doc.moveDown(0.5);
      }
      
      // Add new page for detailed reports
      doc.addPage();
      
      doc.fontSize(18).font('Helvetica-Bold')
         .text('DETAILED CHAIN REPORTS');
      doc.moveDown(2);
      
      // Add detailed info for each chain
      for (const report of allReports) {
        doc.fontSize(14).font('Helvetica-Bold')
           .text(`${report.symbol} DETAILED REPORT`);
        doc.moveDown();
        
        doc.fontSize(10).font('Helvetica')
           .text(`Total Accounts: ${report.summary.totalAccounts}`)
           .text(`Total Balance: ${report.summary.totalBalance} ${report.symbol}`)
           .text(`Network: ${report.networkId}`);
        
        // Add account details for UTXO chains
        if (report.chainType === 'bitcoin' || report.chainType === 'utxo') {
          const bitcoinData = report.accountData as BitcoinAccountData[];
          doc.moveDown();
          
          for (const account of bitcoinData.slice(0, 3)) { // Limit to first 3 accounts
            doc.fontSize(9).font('Helvetica')
               .text(`  ${account.type} Account ${account.account} (${account.bip})`)
               .text(`    Path: ${account.path}`)
               .text(`    Balance: ${account.balance} ${report.symbol}`);
            doc.moveDown(0.5);
          }
        }
        
        doc.moveDown(2);
      }
      
      // Finalize the PDF
      doc.end();
      
      // Wait for the stream to finish
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });
      
      console.log(`📑 Saved combined PDF report: ${pdfPath}`);
      return pdfPath;
    } catch (error: any) {
      console.warn(`⚠️ Combined PDF generation failed (${error.message}), saving as text instead`);
      return await this.generateCombinedReport(allReports, filename);
    }
  }

  // Generate a combined text report for multiple chains
  async generateCombinedReport(allReports: ReportData[], filename: string): Promise<string> {
    const combinedPath = path.join(this.outputDir, `${filename}_combined.txt`);
    
    let content = `Multi-Chain Portfolio Report\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Total Chains: ${allReports.length}\n`;
    content += '='.repeat(60) + '\n\n';
    
    // Combined summary
    let totalAccounts = 0;
    let totalValueUsd = 0;
    let totalTransactions = 0;
    let totalAddresses = 0;
    
    allReports.forEach(report => {
      totalAccounts += report.summary.totalAccounts;
      totalValueUsd += report.summary.totalValueUsd || 0;
      totalTransactions += report.summary.totalTransactions || 0;
      totalAddresses += report.summary.totalAddresses || 0;
    });
    
    content += 'PORTFOLIO SUMMARY\n';
    content += '-'.repeat(30) + '\n';
    content += `Total Chains: ${allReports.length}\n`;
    content += `Total Accounts: ${totalAccounts}\n`;
    content += `Total Portfolio Value: $${totalValueUsd.toFixed(2)} USD\n`;
    content += `Total Transactions: ${totalTransactions}\n`;
    content += `Total Addresses: ${totalAddresses}\n\n`;
    
    // Chain breakdown
    content += 'CHAIN BREAKDOWN\n';
    content += '-'.repeat(30) + '\n\n';
    
    allReports.forEach((report, index) => {
      const chainType = report.chainType.toUpperCase();
      content += `${index + 1}. ${report.symbol} (${chainType})\n`;
      content += `   Network: ${report.networkId}\n`;
      content += `   Accounts: ${report.summary.totalAccounts}\n`;
      content += `   Balance: ${report.summary.totalBalance} ${report.symbol}\n\n`;
    });
    
    // Detailed reports
    content += '\nDETAILED CHAIN REPORTS\n';
    content += '='.repeat(60) + '\n\n';
    
    for (const report of allReports) {
      content += `\n${report.symbol} DETAILED REPORT\n`;
      content += '='.repeat(40) + '\n';
      
      // Add the text content from individual report
      const individualPath = await this.generateTextReport(report, `temp_${report.symbol}`);
      const individualContent = await fs.readFile(individualPath, 'utf8');
      content += individualContent + '\n\n';
      
      // Clean up temp file
      await fs.remove(individualPath);
    }
    
    await fs.writeFile(combinedPath, content, 'utf8');
    console.log(`📄 Saved combined text report: ${combinedPath}`);
    return combinedPath;
  }
}