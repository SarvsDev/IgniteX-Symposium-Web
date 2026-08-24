import React, { useEffect, useRef } from 'react';
import { X, QrCode, ShieldCheck, Download, Printer, Calendar, MapPin, Ticket, Crown, MessageCircle, ExternalLink, FileText, Clock } from 'lucide-react';
import QRCode from 'qrcode';
import { Registration } from '../types';
import { soundFx } from './AudioEffects';

interface TicketPassModalProps {
  registrations: Registration[];
  onClose: () => void;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  registrations,
  onClose,
}) => {
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    registrations.forEach((reg) => {
      const isApproved = reg.paymentStatus === 'SUCCESS' || reg.paymentStatus === 'APPROVED' || reg.paymentStatus === 'PAID';
      if (!isApproved) return;

      const canvas = canvasRefs.current[reg.id];
      if (canvas) {
        QRCode.toCanvas(
          canvas,
          reg.ticketHash || reg.id,
          {
            width: 140,
            margin: 1,
            color: {
              dark: '#00FF66',
              light: '#030a05',
            },
          },
          (error) => {
            if (error) console.error('Error rendering QR code:', error);
          }
        );
      }
    });
  }, [registrations]);

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#030a05] border border-emerald-800 shadow-2xl p-6 text-left space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900 pb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-mono font-black text-white uppercase flex items-center gap-2">
              <span>MY ENTRY PASSES</span>
              <span className="text-emerald-400 text-sm">({registrations.length})</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {registrations.some((r) => r.paymentStatus === 'SUCCESS' || r.paymentStatus === 'APPROVED') && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08150c] border border-emerald-900 text-xs font-mono text-emerald-300 hover:text-white"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Passes</span>
              </button>
            )}

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-[#08150c] border border-emerald-900 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Channel Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950 via-[#062010] to-green-950 border border-emerald-500/80 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-300">
            <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Official IgniteX WhatsApp Channel</span>
              <span className="text-[10px] text-emerald-400/80">Get instant sector updates, live schedules & event notifications</span>
            </div>
          </div>
          <a
            href="https://whatsapp.com/channel/0029Va9IgniteX2026"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundFx.playClick()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shrink-0 shadow-md transition-all"
          >
            <span>Join Channel</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* List of passes */}
        {registrations.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Ticket className="w-12 h-12 text-emerald-800 mx-auto" />
            <p className="text-sm font-mono text-emerald-400">No event passes found in your wallet.</p>
            <p className="text-xs font-mono text-emerald-600">
              Register for events. Once approved by the administrator, your official entry pass with unique alphanumeric code and QR code will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {registrations.map((reg) => {
              const isApproved = reg.paymentStatus === 'SUCCESS' || reg.paymentStatus === 'APPROVED' || reg.paymentStatus === 'PAID';

              return (
                <div
                  key={reg.id}
                  className="relative overflow-hidden rounded-2xl bg-[#040e07]/90 border border-emerald-500/40 p-5 shadow-[0_0_25px_rgba(0,255,102,0.15)] print:border-black print:text-black"
                >
                  {/* Holographic accent */}
                  <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-emerald-500/10 to-amber-500/10 blur-2xl pointer-events-none" />

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Left Pass Details */}
                    <div className="md:col-span-8 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-emerald-900 pb-2">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                          <Crown className="w-3 h-3 text-emerald-400" />
                          <span>IGNITEX '26 // ENTRY PASS</span>
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold border ${
                            isApproved
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                              : 'bg-amber-950 text-amber-400 border-amber-700'
                          }`}
                        >
                          {isApproved ? '✓ APPROVED' : 'PENDING APPROVAL'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{reg.eventTitle}</h3>
                        <p className="text-xs text-amber-400 mt-0.5">{reg.userCollege}</p>
                        <p className="text-[10px] text-emerald-400 font-mono mt-1">REGISTRATION ID: <strong>{reg.registrationNumber || 'IGX-XXXX'}</strong></p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
                        <div>
                          <span className="text-[10px] text-emerald-500/80 block">PARTICIPANT</span>
                          <span className="font-bold text-white">{reg.userName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-500/80 block">TIME & DAY</span>
                          <span className="text-emerald-300">{reg.eventDay} ({reg.eventTime})</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-500/80 block">SECTOR VENUE</span>
                          <span className="text-emerald-300">{reg.eventVenue}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-500/80 block">RECEIPT & TXN REF</span>
                          <span className="text-[11px] text-amber-400/90 font-bold block">{reg.receiptNumber || 'RCPT-2026-78192'}</span>
                          <span className="text-[9px] text-neutral-400 block truncate">{reg.transactionId}</span>
                        </div>
                      </div>

                      {reg.teamName && (
                        <div className="text-xs text-neutral-300 pt-1 border-t border-emerald-900">
                          <span className="text-emerald-500">Squad: </span>
                          <strong className="text-amber-400">{reg.teamName}</strong>
                          {reg.teamMembers && reg.teamMembers.length > 0 && (
                            <span className="text-[11px] text-emerald-400/80 block mt-0.5">
                              Members: {reg.teamMembers.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right QR Code / Pending Box */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#020703] border border-emerald-900 text-center">
                      {isApproved ? (
                        <>
                          <canvas
                            ref={(el) => {
                              canvasRefs.current[reg.id] = el;
                            }}
                            className="rounded-lg border border-emerald-800 shadow-inner"
                          />
                          <div className="font-mono text-xs font-bold text-emerald-400 mt-2 tracking-wider">
                            {reg.ticketHash}
                          </div>
                          <div className="text-[9px] font-mono text-amber-400 uppercase mt-0.5">
                            {reg.attended ? '✓ VERIFIED ENTRY' : 'IGNITEX PASS CODE'}
                          </div>
                        </>
                      ) : (
                        <div className="py-4 space-y-2">
                          <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-500 flex items-center justify-center mx-auto text-amber-400">
                            <Clock className="w-6 h-6 animate-pulse" />
                          </div>
                          <span className="text-xs font-mono font-bold text-amber-300 block">
                            AWAITING APPROVAL
                          </span>
                          <p className="text-[10px] font-mono text-neutral-400 max-w-[140px] mx-auto">
                            Pass code & QR will activate upon admin confirmation.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
