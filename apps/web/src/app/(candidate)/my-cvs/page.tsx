import { getUiVariant } from '@/lib/ui-variant';
import LegacyMyCvsPage from '@/legacy/app/(candidate)/my-cvs/page';
import MyCvsClient from '@/components/my-cvs/MyCvsClient';
import { getMyCvsAction } from '@/servers/cvs/cvs.action';
import { CvStoreProvider } from '@/stores/useCvStore';

export default async function MyCvsPage() {
    if ((await getUiVariant()) === 'legacy') return <LegacyMyCvsPage />;
    const cvs = await getMyCvsAction();

    return (
        <CvStoreProvider key={JSON.stringify(cvs)} initialState={cvs}>
            <MyCvsClient />
        </CvStoreProvider>
    );
}
