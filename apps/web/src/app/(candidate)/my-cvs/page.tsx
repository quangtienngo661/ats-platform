import MyCvsClient from '@/components/my-cvs/MyCvsClient';
import { getMyCvsAction } from '@/servers/cvs/cvs.action';
import { CvsHydrator } from '@/components/hydrators/CvsHydrator';

export default async function MyCvsPage() {
    const cvs = await getMyCvsAction();

    return (
        <>
            <CvsHydrator initialCvs={cvs} />
            <MyCvsClient cvs={cvs} />
        </>
    );
}
