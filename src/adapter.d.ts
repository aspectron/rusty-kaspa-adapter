import type { Connection, PublicKey, SendOptions, Signer, Transaction, TransactionSignature } from './web3.js';
import EventEmitter from 'eventemitter3';
import { type WalletError } from './errors.js';
import type { SupportedTransactionVersions, TransactionOrVersionedTransaction } from './transaction.js';
export { EventEmitter };
export interface WalletAdapterEvents {
    connect(publicKey: PublicKey): void;
    disconnect(): void;
    error(error: WalletError): void;
    readyStateChange(readyState: WalletReadyState): void;
}
export interface SendTransactionOptions extends SendOptions {
    signers?: Signer[];
}
export type WalletName<T extends string = string> = T & {
    __brand__: 'WalletName';
};
export interface WalletAdapterProps<Name extends string = string> {
    name: WalletName<Name>;
    url: string;
    icon: string;
    readyState: WalletReadyState;
    publicKey: PublicKey | null;
    connecting: boolean;
    connected: boolean;
    supportedTransactionVersions?: SupportedTransactionVersions;
    autoConnect(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(transaction: TransactionOrVersionedTransaction<this['supportedTransactionVersions']>, connection: Connection, options?: SendTransactionOptions): Promise<TransactionSignature>;
}
export type WalletAdapter<Name extends string = string> = WalletAdapterProps<Name> & EventEmitter<WalletAdapterEvents>;
export declare enum WalletReadyState {
    Installed = "Installed",
    NotDetected = "NotDetected",
    Loadable = "Loadable",
    Unsupported = "Unsupported"
}
export declare abstract class BaseWalletAdapter<Name extends string = string> extends EventEmitter<WalletAdapterEvents> implements WalletAdapter<Name> {
    abstract name: WalletName<Name>;
    abstract url: string;
    abstract icon: string;
    abstract readyState: WalletReadyState;
    abstract publicKey: PublicKey | null;
    abstract connecting: boolean;
    abstract supportedTransactionVersions?: SupportedTransactionVersions;
    get connected(): boolean;
    autoConnect(): Promise<void>;
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract sendTransaction(transaction: TransactionOrVersionedTransaction<this['supportedTransactionVersions']>, connection: Connection, options?: SendTransactionOptions): Promise<TransactionSignature>;
    protected prepareTransaction(transaction: Transaction, connection: Connection, options?: SendOptions): Promise<Transaction>;
}
export declare function scopePollingDetectionStrategy(detect: () => boolean): void;
export declare function isIosAndRedirectable(): boolean;
