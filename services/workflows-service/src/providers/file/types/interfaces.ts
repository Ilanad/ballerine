import { Readable } from 'stream';
import { TLocalFilePath, TRemoteFileConfig } from './files-types';

export interface IFileProvider {
  isRemoteFileExists(remoteFileConfig: TRemoteFileConfig): Promise<boolean>;
  downloadFile(
    remoteFileConfig: TRemoteFileConfig,
    localeFilePath: TLocalFilePath,
  ): Promise<TLocalFilePath>;
  uploadFile(
    localFilePath: TLocalFilePath,
    remoteFileConfig: TRemoteFileConfig,
  ): Promise<TRemoteFileConfig | TLocalFilePath | void>;
}

export interface IStreamableFileProvider extends IFileProvider {
  fetchRemoteFileDownStream(remoteFileConfig: TRemoteFileConfig): Promise<Readable>;
  uploadFileStream(
    fileStream: Readable,
    remoteFileConfig: TRemoteFileConfig,
  ): Promise<TRemoteFileConfig>;
}