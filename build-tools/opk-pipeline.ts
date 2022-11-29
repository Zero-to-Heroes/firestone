import 'reflect-metadata';
import { OwCliContainer } from '@overwolf/ow-cli/bin';

const pipeline = async () => {
	OwCliContainer.init();
};

pipeline();
