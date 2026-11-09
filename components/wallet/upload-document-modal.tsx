'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { uploadWalletDocumentAction } from '@/actions/wallet';
import { AsaasDocumentGroup } from '@/lib/asaas/types';

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentGroup: AsaasDocumentGroup | null;
  onSuccess: () => void;
}

export function UploadDocumentModal({
  open,
  onOpenChange,
  documentGroup,
  onSuccess,
}: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!documentGroup) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Selecione um arquivo para envio.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.set('file', file);

      const res = await uploadWalletDocumentAction(documentGroup.id, formData);
      setIsUploading(false);

      if (res.success) {
        setSuccessMsg(res.message || 'Documento enviado com sucesso!');
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          setFile(null);
          setSuccessMsg(null);
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Falha ao enviar documento.');
      }
    } catch (err: unknown) {
      setIsUploading(false);
      const msg = err instanceof Error ? err.message : 'Erro ao processar envio.';
      setErrorMsg(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-zinc-200 p-6 rounded-2xl shadow-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-zinc-900">
            Enviar Documento para o Asaas
          </DialogTitle>
          <p className="text-xs text-zinc-500">
            {documentGroup.title || 'Documentação Pendente'}
          </p>
        </DialogHeader>

        {documentGroup.description && (
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-600 leading-relaxed">
            {documentGroup.description}
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4 pt-1">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="w-5 h-5 text-zinc-500 shrink-0" />
                <div className="truncate">
                  <span className="block text-xs font-semibold text-zinc-800 truncate">
                    {file.name}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline ml-2 shrink-0 cursor-pointer"
              >
                Substituir
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-200 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/40"
            >
              <UploadCloud className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <span className="block text-xs font-bold text-zinc-800 mb-0.5">
                Clique para selecionar o arquivo
              </span>
              <span className="block text-[11px] text-zinc-400">
                PDF, PNG ou JPG (até 10 MB)
              </span>
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
              className="h-10 text-xs font-semibold text-zinc-700 border-zinc-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!file || isUploading}
              className="h-10 px-5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar ao Asaas'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

