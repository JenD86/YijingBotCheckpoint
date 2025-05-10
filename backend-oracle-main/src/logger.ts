export const logger = {
  log: (section: string, data: any) => {
    console.log('\n' + '='.repeat(50));
    console.log(`=== ${section} ===`);
    console.log('='.repeat(50));
    console.log(data);
    console.log('='.repeat(50) + '\n');
  }
};
