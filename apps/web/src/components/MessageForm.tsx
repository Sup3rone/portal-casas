'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
    >
      {pending ? 'Enviando...' : 'Enviar Consulta'}
    </button>
  );
}

export default function MessageForm({ propertyId, locale }: { propertyId: number; locale: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(formData: FormData) {
    try {
      const res = await fetch(`/api/${locale}/messages`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al enviar');

      setStatus('success');
      setMessage('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      console.error(err);
    }
  }

  if (status === 'success') {
    return (
      <div className="text-green-600 font-medium p-4 bg-green-50 rounded-lg">
        ¡Mensaje enviado con éxito! Te contactaremos pronto.
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="propertyId" value={propertyId} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
        <input required type="text" id="name" name="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input required type="email" id="email" name="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono (opcional)</label>
        <input type="tel" id="phone" name="phone" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
        <input required type="date" id="startDate" name="startDate" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
      </div>

      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fecha Fin</label>
        <input required type="date" id="endDate" name="endDate" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700">Mensaje</label>
        <textarea required id="body" name="body" rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"></textarea>
      </div>

      {status === 'error' && (
        <div className="text-red-600 text-sm">Hubo un error al enviar. Intenta de nuevo.</div>
      )}

      <SubmitButton />
    </form>
  );
}
