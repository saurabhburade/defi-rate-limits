import { Address } from "viem";
import { AddressComponent } from "~~/app/blockexplorer/_components/AddressComponent";
import { isZeroAddress } from "~~/utils/scaffold-eth/common";
import { getFoundryContractData } from "~~/utils/scaffold-eth/foundryArtifacts";

type PageProps = {
  params: Promise<{ address: Address }>;
};

const getContractData = async (address: Address) => {
  return getFoundryContractData(address);
};

export function generateStaticParams() {
  // An workaround to enable static exports in Next.js, generating single dummy page.
  return [{ address: "0x0000000000000000000000000000000000000000" }];
}

const AddressPage = async (props: PageProps) => {
  const params = await props.params;
  const address = params?.address as Address;

  if (isZeroAddress(address)) return null;

  const contractData: { bytecode: string; assembly: string } | null = await getContractData(address);
  return <AddressComponent address={address} contractData={contractData} />;
};

export default AddressPage;
