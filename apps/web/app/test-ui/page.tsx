'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { ShareButton } from '@/components/share/share-button';

export default function TestUIPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    return (
        <div className="p-8 flex flex-col gap-4">
            <h1 className="text-2xl font-bold">UI Test Page</h1>

            <div className="flex gap-4">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                    Open Modal
                </button>

                <button
                    onClick={() => showToast('This is a test toast')}
                    className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
                >
                    Show Toast
                </button>

                <ShareButton
                    eventData={{
                        title: 'Test Event',
                        date: '20/11/2025',
                        city: 'Test City',
                        url: '/test-event'
                    }}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Test Modal Title"
            >
                <p>This is the modal content.</p>
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-4 px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700"
                >
                    Close Modal
                </button>
            </Modal>
        </div>
    );
}
