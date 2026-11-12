'use client';

import { useActionState } from 'react';
import { SF } from '@/types/fonts/fonts';
import { setModelPriceAction, type ModelPriceActionState } from '@/servers/analytics/analytics.action';
import type { IModelPrice } from '@/types/interfaces/analytics.interface';

const initialState: ModelPriceActionState = { success: false, message: '' };
const inputClass =
    'w-28 rounded-lg border border-[#E5E5EA] px-2 py-1.5 text-right text-[12px] outline-none focus:border-[#0071E3]';

function PriceRow({ price }: { price: IModelPrice }) {
    const [state, formAction, pending] = useActionState(setModelPriceAction, initialState);
    const formId = `price-${price.modelName}`;
    return (
        <tr className="border-t border-[#F2F2F7] align-top">
            <th scope="row" className="py-2 pr-3 text-left font-normal text-[#1D1D1F] break-all">{price.modelName}</th>
            <td className="py-2 pr-3">
                <input
                    form={formId}
                    name="inputUsdPerMillion"
                    inputMode="decimal"
                    aria-label={`Giá token vào của ${price.modelName}`}
                    defaultValue={price.inputUsdPerMillion ?? ''}
                    className={inputClass}
                />
            </td>
            <td className="py-2 pr-3">
                <input
                    form={formId}
                    name="outputUsdPerMillion"
                    inputMode="decimal"
                    aria-label={`Giá token ra của ${price.modelName}`}
                    defaultValue={price.outputUsdPerMillion ?? ''}
                    className={inputClass}
                />
            </td>
            <td className="py-2">
                <form id={formId} action={formAction} className="flex flex-col items-start gap-1">
                    <input type="hidden" name="modelName" value={price.modelName} />
                    <button
                        type="submit"
                        disabled={pending}
                        aria-label={`Lưu giá ${price.modelName}`}
                        className="rounded-lg bg-[#0071E3] px-3 py-1.5 text-[12px] text-white hover:bg-[#0062C4] disabled:opacity-50"
                    >
                        Lưu giá
                    </button>
                    {state.message && (
                        <span role={state.success ? 'status' : 'alert'}
                            className={`text-[11px] ${state.success ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                            {state.message}
                        </span>
                    )}
                </form>
            </td>
        </tr>
    );
}

/** Admin-entered model prices (GĐ4 R21): the AI cost is estimated from these, nothing else. */
export function AiModelPricesPanel({ prices }: { prices: IModelPrice[] }) {
    return (
        <section aria-labelledby="model-prices-title" className="mt-6 bg-white rounded-2xl p-5 border border-[#F2F2F7]">
            <h2 id="model-prices-title" className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                Bảng giá model AI
            </h2>
            <p className="text-[12px] text-[#6E6E73] mt-0.5">
                USD cho 1 triệu token. Model chưa có giá thì chi phí hiện &quot;Chưa có giá&quot;.
            </p>
            {prices.length === 0 ? (
                <p className="mt-4 text-[13px] text-[#AEAEB2]">Chưa có model nào trong nhật ký AI</p>
            ) : (
                <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-[12px]">
                        <thead>
                            <tr className="text-left text-[#6E6E73]">
                                <th scope="col" className="py-1.5 font-medium">Model</th>
                                <th scope="col" className="py-1.5 font-medium">Token vào</th>
                                <th scope="col" className="py-1.5 font-medium">Token ra</th>
                                <th scope="col" className="py-1.5 font-medium"><span className="sr-only">Lưu</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {prices.map(price => <PriceRow key={price.modelName} price={price} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
