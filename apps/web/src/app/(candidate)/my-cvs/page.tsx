import MyCvsClient from '@/components/my-cvs/MyCvsClient';
import { getMyCvsAction } from '@/servers/cvs/cvs.action';
import { CvStoreProvider } from '@/stores/useCvStore';

export default async function MyCvsPage() {
    const cvs = await getMyCvsAction();

    return (
        <CvStoreProvider key={JSON.stringify(cvs)} initialState={cvs}>
            <MyCvsClient />
        </CvStoreProvider>
    );
}
